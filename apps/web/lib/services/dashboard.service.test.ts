import { describe, expect, it } from 'vitest';

import { ApiError } from '../repositories/coffer-api.repository';

import { classifyFailure } from './dashboard.service';

describe('classifyFailure', () => {
  it('reads a rate limited response as a rejection rather than an unreachable api', () => {
    const failure = classifyFailure(
      new ApiError('rejected', 429, '429 ThrottlerException: Too Many Requests'),
    );

    expect(failure.state).toBe('rejected');
    expect(failure.apiError).toBe('429 ThrottlerException: Too Many Requests');
  });

  it('reads a refused connection as unreachable', () => {
    const failure = classifyFailure(
      new ApiError('unreachable', null, 'connect ECONNREFUSED 127.0.0.1:3001'),
    );

    expect(failure.state).toBe('unreachable');
    expect(failure.apiError).toBe('connect ECONNREFUSED 127.0.0.1:3001');
  });

  it('keeps the message of an error the repository did not raise', () => {
    expect(classifyFailure(new Error('boom'))).toEqual({
      state: 'unreachable',
      apiError: 'boom',
    });
  });

  it('falls back when something other than an error is thrown', () => {
    expect(classifyFailure('boom')).toEqual({
      state: 'unreachable',
      apiError: 'The dashboard could not be read.',
    });
  });
});
