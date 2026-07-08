import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button.jsx';
import { fileUploadService } from '../services/file-upload.service.js';

function resolveUploadFileUrl(result) {
  return String(result?.fileUrl || result?.url || '').trim();
}

export function FileUpload({
  onUpload,
  folder = 'default',
  accept = 'image/*',
  label,
  disabled = false,
  resetKey,
}) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    setUploadedUrl(null);
    setError(null);
    setIsUploading(false);
  }, [resetKey]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await fileUploadService.uploadFile(file, folder);
      const fileUrl = resolveUploadFileUrl(result);
      setUploadedUrl(fileUrl || null);
      onUpload?.({ ...result, fileUrl });
    } catch (err) {
      setError(err.message || t('common.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  }, [folder, onUpload, t]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [disabled, isUploading, handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return (
    <div className="file-upload">
      {label && <label className="file-upload-label">{label}</label>}
      
      <div 
        className={`file-upload-area ${isDragOver ? 'file-upload-area--dragover' : ''} ${disabled || isUploading ? 'file-upload-area--disabled' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          id={`file-upload-${label?.replace(/\s/g, '-')}`}
          type="file"
          accept={accept}
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={disabled || isUploading}
          className="file-upload-input"
        />
        
        {isUploading ? (
          <div className="file-upload-status">
            <div className="file-upload-spinner" />
            <span>{t('common.uploading')}</span>
          </div>
        ) : (
          <div className="file-upload-prompt">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-color-brand-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="file-upload-drag-text">DRAG & DROP</p>
            <p className="file-upload-or">or</p>
            <Button disabled={disabled} onClick={() => document.getElementById(`file-upload-${label?.replace(/\s/g, '-')}`)?.click()}>
              {t('common.selectFile')}
            </Button>
          </div>
        )}
        
        {error && <div className="file-upload-error">{error}</div>}
      </div>
      
      {uploadedUrl && (
        <div className="file-upload-preview">
          {accept.includes('image') && (
            <div className="file-upload-preview-image-container">
              <img src={uploadedUrl} alt="Preview" className="file-upload-preview-image" />
            </div>
          )}
          <div className="file-upload-preview-info">
            <span className="file-upload-preview-label">{t('common.uploadedFile')}:</span>
            <a href={uploadedUrl} target="_blank" rel="noreferrer" className="file-upload-preview-link">
              {t('common.viewFile')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
