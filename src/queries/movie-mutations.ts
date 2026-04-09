import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  createMovieComment,
  deleteMovieComment,
  type CreateMovieCommentDto,
} from '../services/sdk';
import { movieQueryOptions } from './movie-queries';

export const useCreateMovieComment = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (body: CreateMovieCommentDto) =>
      createMovieComment({ body, throwOnError: true }).then((res) => res.data),
    onSuccess: async (_data, { movieId }) => {
      queryClient.invalidateQueries({
        queryKey: movieQueryOptions.movieComments(movieId).queryKey,
      });

      enqueueSnackbar({
        message: 'Comment created successfully',
        variant: 'success',
      });
    },
    onError: () =>
      enqueueSnackbar({
        message: 'Comment failed to create',
        variant: 'error',
      }),
  });
};

export const useDeleteMovieComment = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id }: { id: string; movieId: string }) =>
      deleteMovieComment({
        path: { id },
        throwOnError: true,
      }).then((res) => res.data),
    onSuccess: async (_data, { movieId }) => {
      queryClient.invalidateQueries({
        queryKey: movieQueryOptions.movieComments(movieId).queryKey,
      });

      enqueueSnackbar({
        message: 'Comment deleted successfully',
        variant: 'success',
      });
    },
    onError: () =>
      enqueueSnackbar({
        message: 'Comment failed to create',
        variant: 'error',
      }),
  });
};
