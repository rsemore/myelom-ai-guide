import { useMutation, useQueryClient } from "@tanstack/react-query";

import { chatApi } from "./chat";

export function useLogout(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["logout"],
    mutationFn: () => chatApi.logout(),
    retry: false,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.setQueryData(["auth-user"], null);
      for (const queryKey of [["chat"], ["chat-sessions"], ["knowledge"]])
        queryClient.removeQueries({ queryKey });
      queryClient.getMutationCache().clear();
      onSuccess?.();
    },
  });
}
