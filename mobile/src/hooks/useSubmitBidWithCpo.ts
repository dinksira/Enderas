import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bidApi, type SubmitBidWithCpoPayload } from '@/services/bidApi';

export function useSubmitBidWithCpo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitBidWithCpoPayload) => bidApi.submitBidWithCpo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
      queryClient.invalidateQueries({ queryKey: ['participation'] });
    },
  });
}

export default useSubmitBidWithCpo;
