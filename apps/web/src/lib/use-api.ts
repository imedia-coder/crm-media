import useSWR, { SWRConfiguration } from 'swr';
import { api } from './api';

export function useApi<T>(path: string | null, config?: SWRConfiguration) {
  return useSWR<T>(path, (p: string) => api.get<T>(p), {
    revalidateOnFocus: false,
    dedupingInterval: 4000,
    ...config,
  });
}
