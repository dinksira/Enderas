import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';

import { GlassCard } from '@/components/shell/GlassCard';
import { useTheme } from '@/lib/appStore';
import { Typography, Spacing } from '@/theme';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString();
      if (result) {
        resolve(result);
        return;
      }
      reject(new Error('Could not read PDF data'));
    };
    reader.onerror = () => reject(new Error('Could not read PDF data'));
    reader.readAsDataURL(blob);
  });
}

function downloadPdfAsDataUrl(
  url: string,
  onProgress: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'blob';

    request.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(event.loaded / event.total);
      }
    };

    request.onload = async () => {
      if (request.status >= 200 && request.status < 300 && request.response) {
        try {
          onProgress(1);
          const dataUrl = await blobToDataUrl(request.response as Blob);
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
        return;
      }
      reject(new Error(`Request failed with status ${request.status}`));
    };

    request.onerror = () => reject(new Error('Network error'));
    request.onabort = () => reject(new Error('Request aborted'));
    request.send();
  });
}

function buildPdfViewerHtml(pdfDataUrl: string, backgroundColor: string, textColor: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes"
    />
    <title>Document Viewer</title>
    <style>
      :root {
        color-scheme: dark;
      }
      html, body {
        margin: 0;
        padding: 0;
        min-height: 100%;
        background: ${backgroundColor};
        color: ${textColor};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #status {
        position: sticky;
        top: 0;
        z-index: 10;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.7);
        font-size: 14px;
      }
      #pages {
        padding: 12px;
      }
      .page {
        margin: 0 auto 16px;
        width: fit-content;
        max-width: 100%;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
      }
      .page canvas {
        display: block;
        max-width: 100%;
        height: auto;
      }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs" type="module"></script>
  </head>
  <body>
    <div id="status">Rendering document...</div>
    <div id="pages"></div>
    <script type="module">
      const statusEl = document.getElementById('status');
      const pagesEl = document.getElementById('pages');
      const pdfDataUrl = ${JSON.stringify(pdfDataUrl)};

      const send = (payload) => {
        window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
      };

      const render = async () => {
        try {
          const pdfjsLib = globalThis.pdfjsLib;
          if (!pdfjsLib) {
            throw new Error('PDF engine unavailable');
          }
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';

          const base64 = pdfDataUrl.split(',')[1];
          const raw = atob(base64);
          const bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i += 1) {
            bytes[i] = raw.charCodeAt(i);
          }

          const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
          statusEl.textContent = 'Rendering pages...';

          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.2 });
            const wrapper = document.createElement('div');
            wrapper.className = 'page';
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            wrapper.appendChild(canvas);
            pagesEl.appendChild(wrapper);
            await page.render({ canvasContext: context, viewport }).promise;
            send({ type: 'page', pageNumber, totalPages: pdf.numPages });
          }

          statusEl.remove();
          send({ type: 'ready', totalPages: pdf.numPages });
        } catch (error) {
          statusEl.textContent = 'Preview failed';
          send({ type: 'error', message: error instanceof Error ? error.message : 'Preview failed' });
        }
      };

      render();
    </script>
  </body>
</html>`;
}

interface DocumentViewerProps {
  documentUrl: string;
}

export function DocumentViewer({ documentUrl }: DocumentViewerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerProgress, setViewerProgress] = useState(0);
  const [viewerReady, setViewerReady] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);

  const viewerHtml = useMemo(() => {
    if (!pdfDataUrl) return null;
    return buildPdfViewerHtml(pdfDataUrl, colors.base, colors.cream);
  }, [colors.base, colors.cream, pdfDataUrl]);

  useEffect(() => {
    let cancelled = false;

    const startDownload = () => {
      setViewerError(null);
      setViewerReady(false);
      setViewerProgress(0);
      setPdfDataUrl(null);

      downloadPdfAsDataUrl(documentUrl, (progress) => {
        if (!cancelled) setViewerProgress(progress);
      })
        .then((dataUrl) => {
          if (cancelled) return;
          setViewerProgress(1);
          setPdfDataUrl(dataUrl);
        })
        .catch(() => {
          if (cancelled) return;
          setViewerError(t('auction.participation.downloadErrorBody'));
        });
    };

    const timer = setTimeout(startDownload, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [documentUrl, t]);

  if (viewerError) {
    return (
      <View style={styles.content}>
        <GlassCard padding={Spacing.lg}>
          <Text style={[Typography.body, { color: colors.danger.fg }]}>{viewerError}</Text>
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.viewerShell}>
      {viewerHtml ? (
        <WebView
          source={{ html: viewerHtml }}
          style={styles.viewer}
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          onError={() => {
            setViewerError(t('auction.participation.downloadErrorBody'));
          }}
          onMessage={(event) => {
            try {
              const payload = JSON.parse(event.nativeEvent.data);
              if (payload?.type === 'ready') {
                setViewerReady(true);
                return;
              }
              if (payload?.type === 'error') {
                setViewerError(t('auction.participation.viewerFallback'));
              }
            } catch {
              // Ignore malformed viewer messages.
            }
          }}
        />
      ) : null}
      {!viewerError && !viewerReady ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View
            style={[
              styles.loadingCard,
              {
                backgroundColor: colors.baseElevated,
                borderColor: colors.goldBorder,
              },
            ]}
          >
            <ActivityIndicator color={colors.goldBright} />
            <Text style={[Typography.body, styles.loadingTitle, { color: colors.cream }]}>
              {pdfDataUrl ? t('auction.participation.renderingDocument') : t('auction.participation.loadingDocument')}
            </Text>
            <Text style={[Typography.caption, { color: colors.textMuted }]}>
              {pdfDataUrl
                ? t('auction.participation.renderingDocumentHint')
                : t('auction.participation.loadingDocumentProgress', {
                    progress: Math.max(1, Math.round(viewerProgress * 100)),
                  })}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  viewerShell: {
    flex: 1,
    overflow: 'hidden',
  },
  viewer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingCard: {
    minWidth: 220,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md2,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  loadingTitle: {
    fontWeight: '700',
  },
});
