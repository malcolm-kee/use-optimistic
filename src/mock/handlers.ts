import { HttpResponse, delay, type HttpHandler } from 'msw';
import { faker } from '@faker-js/faker';
import { createMswHandlers } from '../services/sdk/msw.gen';
import {
  addMovieComment,
  deleteMovieComment,
  getMovieComments,
  movieData,
} from './mock-movie-data';

const mock = createMswHandlers({
  baseUrl: 'https://ecomm-service.fly.dev',
});

export const FLAGS = {
  slowResponse: false,
  forceError: false,
};

export const handlers: Array<HttpHandler> = [
  mock.pick.getMovies({
    body: movieData,
  }),
  mock.pick.getMovie(async ({ params }) => {
    const movie = movieData.find((m) => m._id === params.movieId);

    if (movie) {
      await delay(FLAGS.slowResponse ? faker.helpers.arrayElement([500, 2000]) : 300);
      return HttpResponse.json(movie);
    }

    return new HttpResponse(null, { status: 404 });
  }),
  mock.pick.listMovieComments(async ({ params }) => {
    await delay(FLAGS.slowResponse ? 1000 : 300);
    return HttpResponse.json(getMovieComments(params.movieId));
  }),
  mock.pick.createMovieComment(async ({ request }) => {
    const body = await request.clone().json();
    await delay(FLAGS.slowResponse ? 1500 : 300);

    return FLAGS.forceError
      ? new HttpResponse('Internal Server Error', { status: 500 })
      : HttpResponse.json(addMovieComment(body));
  }),
  mock.pick.deleteMovieComment(async ({ params }) => {
    await delay(FLAGS.slowResponse ? 2000 : 300);
    const deletedComment = deleteMovieComment(params.id);

    if (deletedComment && !FLAGS.forceError) {
      return HttpResponse.json(deletedComment);
    }

    return new HttpResponse(null, { status: 404 });
  }),
];
