import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { createBrowserRouter, Link, RouterProvider, useParams } from 'react-router-dom';
import { useCreateMovieComment, useDeleteMovieComment } from './queries/movie-mutations';
import { movieQueryOptions } from './queries/movie-queries';
import type { CreateMovieCommentDto, MovieCommentDto } from './services/sdk';

let mockingPromise: Promise<unknown> | undefined;

const startMocking = () => {
  if (!mockingPromise) {
    mockingPromise = import('./mock/browser').then(({ enableMocking }) => enableMocking());
  }
  return mockingPromise;
};

export const MovieApp = () => (
  <React.Suspense fallback={null}>
    <MovieAppRoot />
  </React.Suspense>
);

const MovieAppRoot = () => {
  React.use(startMocking());

  const [router] = React.useState(() =>
    createBrowserRouter([
      { path: '/', element: <MovieListPage /> },
      { path: '/:movieId', element: <MovieDetailPage /> },
      { path: '/suspended/:movieId', element: <SuspendedMovieDetailPage /> },
    ])
  );

  return (
    <>
      <Helmet titleTemplate="%s - Movies" defaultTitle="Movies" />
      <RouterProvider router={router} />
    </>
  );
};

const MovieListPage = () => {
  const { isLoading, data: movies } = useQuery(movieQueryOptions.movies());
  const [transitioningTo, setTransitioningTo] = React.useState('');
  const [useSuspense, setUseSuspense] = React.useState(false);

  const linkPrefix = useSuspense ? '/suspended' : '';

  return (
    <div className="mx-auto max-w-5xl">
      <Helmet>
        <title>All movies</title>
      </Helmet>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Movies</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useSuspense}
            onChange={(e) => setUseSuspense(e.target.checked)}
            className="rounded"
          />
          Raw Suspense mode
        </label>
      </div>
      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, index) => (
              <li key={index}>
                <MovieCardSkeleton />
              </li>
            ))
          : movies?.map((movie) => (
              <li key={movie._id}>
                <Link
                  to={`${linkPrefix}/${movie._id}`}
                  onClick={() => setTransitioningTo(movie._id)}
                  className={clsx(
                    'block transition hover:opacity-100',
                    transitioningTo
                      ? transitioningTo === movie._id
                        ? ''
                        : 'opacity-60'
                      : 'opacity-90'
                  )}
                >
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="aspect-2/3 w-full rounded object-cover"
                  />
                  <p className="mt-2 font-medium">{movie.title}</p>
                  <p className="text-sm text-gray-500">{movie.releaseDate}</p>
                </Link>
              </li>
            ))}
      </ul>
    </div>
  );
};

const MovieCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-2/3 w-full rounded bg-gray-200" />
    <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
    <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
  </div>
);

const MovieDetailPage = () => {
  const { movieId } = useParams<{ movieId: string }>();

  if (!movieId) {
    return <p>Movie not found.</p>;
  }

  return <MovieDetailView movieId={movieId} />;
};

const MovieDetailView = ({ movieId }: { movieId: string }) => {
  const { data: movie, isLoading } = useQuery(movieQueryOptions.movieDetails(movieId));

  return (
    <div className="mx-auto max-w-5xl">
      <Helmet>
        <title>{movie?.title ?? 'Movie'}</title>
      </Helmet>
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← All movies
      </Link>
      {isLoading && <MovieDetailSkeleton commentSection={<CommentSection movieId={movieId} />} />}
      {movie && (
        <article className="mt-4">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <img src={movie.posterUrl} alt={movie.title} className="md:w-1/3 shrink-0 rounded" />
            <div>
              <h1 className="text-3xl font-bold">{movie.title}</h1>
              <p className="text-sm text-gray-500">{movie.releaseDate}</p>
              <p className="mt-4">{movie.overview}</p>
              {!isLoading && <CommentSection movieId={movieId} />}
            </div>
          </div>
        </article>
      )}
    </div>
  );
};

const MovieDetailSkeleton = (props: { commentSection?: React.ReactNode }) => (
  <div className="mt-4 animate-pulse">
    <div className="flex flex-col md:flex-row gap-6">
      <div className="aspect-2/3 md:w-1/3 shrink-0 rounded bg-gray-200" />
      <div className="flex-1 space-y-3">
        <div className="h-8 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/4 rounded bg-gray-200" />
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-5/6 rounded bg-gray-200" />
        </div>
        {props.commentSection}
      </div>
    </div>
  </div>
);

// --- Raw Suspense example using React.use() ---

type SuspendedTab = 'details' | 'comments';

const SuspendedMovieDetailPage = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const { data: movie, isLoading } = useQuery(movieQueryOptions.movieDetails(movieId ?? ''));
  const [activeTab, setActiveTab] = React.useState<SuspendedTab>('details');
  const [isPending, startTransition] = React.useTransition();

  if (!movieId) {
    return <p>Movie not found.</p>;
  }

  const switchTab = (tab: SuspendedTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Helmet>
        <title>{movie?.title ?? 'Movie'}</title>
      </Helmet>
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← All movies
      </Link>
      {isLoading && <MovieDetailSkeleton />}
      {movie && (
        <article className="mt-4">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <img src={movie.posterUrl} alt={movie.title} className="md:w-1/3 shrink-0 rounded" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{movie.title}</h1>
              <p className="text-sm text-gray-500">{movie.releaseDate}</p>

              {/* Tab buttons */}
              <div className="mt-6 flex gap-1 border-b border-gray-200">
                {(['details', 'comments'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => switchTab(tab)}
                    className={clsx(
                      'px-4 py-2 text-sm font-medium capitalize transition-colors',
                      activeTab === tab
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content — useTransition keeps old content visible while the new tab suspends */}
              <div className={clsx('mt-4', isPending && 'opacity-60 transition-opacity')}>
                <React.Suspense
                  fallback={
                    activeTab === 'comments' ? (
                      <ul className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <CommentSkeleton key={i} />
                        ))}
                      </ul>
                    ) : (
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 w-full rounded bg-gray-200" />
                        <div className="h-4 w-full rounded bg-gray-200" />
                        <div className="h-4 w-5/6 rounded bg-gray-200" />
                      </div>
                    )
                  }
                >
                  {activeTab === 'details' ? (
                    <p>{movie.overview}</p>
                  ) : (
                    <MovieCommentList movieId={movieId} />
                  )}
                </React.Suspense>
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  );
};

const MovieCommentList = ({ movieId }: { movieId: string }) => {
  const { data: comments, isLoading } = useQuery(movieQueryOptions.movieComments(movieId));

  if (isLoading) {
    return (
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CommentSkeleton key={i} />
        ))}
      </ul>
    );
  }

  if (!comments || comments.length === 0) {
    return <p className="text-gray-500">No comments yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li
          key={comment._id}
          className="flex items-start justify-between gap-4 rounded border border-gray-200 p-3"
        >
          <div>
            <p className="text-sm font-medium">
              {comment.userName} <span className="text-gray-500">· {comment.rating}/10</span>
            </p>
            <p className="mt-1">{comment.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};

const CommentSkeleton = () => (
  <li className="flex animate-pulse items-start justify-between gap-4 rounded border border-gray-200 p-3">
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      <div className="h-4 w-5/6 rounded bg-gray-200" />
    </div>
    <div className="h-4 w-12 rounded bg-gray-200" />
  </li>
);

const CommentSection = (props: { movieId: string }) => {
  const commentsQuery = useQuery(movieQueryOptions.movieComments(props.movieId));
  const deleteCommentMutation = useDeleteMovieComment();
  const createCommentMutation = useCreateMovieComment();

  const comments = commentsQuery.data;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-semibold">Comments</h2>
      <MovieComments
        isLoading={commentsQuery.isLoading}
        comments={comments?.map((comment) => ({
          ...comment,
          isPending: !commentsQuery.data?.includes(comment),
        }))}
        onDeleteComment={async (comment) =>
          await deleteCommentMutation.mutateAsync({
            id: comment._id,
            movieId: comment.movieId,
          })
        }
        isDeleting={deleteCommentMutation.isPending}
      />
      <AddMovieCommentForm
        movieId={props.movieId}
        onAddComment={async (body) => {
          await createCommentMutation.mutateAsync(body);
        }}
        isAdding={createCommentMutation.isPending}
      />
    </section>
  );
};

const MovieComments = ({
  isLoading,
  comments,
  onDeleteComment,
  isDeleting,
}: {
  isLoading: boolean;
  comments: (MovieCommentDto & { isPending?: boolean })[] | undefined;
  onDeleteComment: (comment: MovieCommentDto) => Promise<unknown>;
  isDeleting?: boolean;
}) => {
  if (isLoading) {
    return (
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <CommentSkeleton key={index} />
        ))}
      </ul>
    );
  }

  if (!comments || comments.length === 0) {
    return <p className="text-gray-500">No comments yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li
          key={comment._id}
          className={clsx(
            'flex items-start justify-between gap-4 rounded border border-gray-200 p-3',
            comment.isPending && 'animate-pulse'
          )}
        >
          <div>
            <p className="text-sm font-medium">
              {comment.userName} <span className="text-gray-500">· {comment.rating}/10</span>
            </p>
            <p className="mt-1">{comment.content}</p>
          </div>
          {!comment.isPending && (
            <button
              type="button"
              onClick={() => onDeleteComment(comment)}
              disabled={isDeleting}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};

const AddMovieCommentForm = ({
  movieId,
  onAddComment,
  isAdding,
}: {
  movieId: string;
  onAddComment: (body: CreateMovieCommentDto) => Promise<unknown>;
  isAdding?: boolean;
}) => {
  const [rating, setRating] = React.useState(5);
  const [content, setContent] = React.useState('');

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onAddComment({ movieId, rating, content });
    setRating(5);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <label className="block">
        <span className="text-sm font-medium">Rating (0–10)</span>
        <input
          type="number"
          min={0}
          max={10}
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="mt-1 block w-24 rounded border border-gray-300 px-2 py-1"
          disabled={isAdding}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Comment</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          rows={3}
          className="mt-1 block w-full rounded border border-gray-300 px-2 py-1"
          disabled={isAdding}
        />
      </label>
      <button
        type="submit"
        disabled={isAdding}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isAdding ? 'Posting...' : 'Post comment'}
      </button>
    </form>
  );
};
