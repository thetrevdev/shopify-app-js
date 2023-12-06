import {HttpResponseError} from '@shopify/shopify-api';

import type {HandleAdminClientError} from '../../../clients/admin/types';
import {HandleClientErrorOptions} from '../strategies/types';

export function handleClientErrorFactory({
  request,
  authStrategy,
}: HandleClientErrorOptions): HandleAdminClientError {
  return async function handleClientError({
    error,
    params,
    session,
  }): Promise<never> {
    if (error instanceof HttpResponseError !== true) {
      params.logger.debug(
        `Got a response error from the API: ${error.message}`,
      );
      throw error;
    }

    params.logger.debug(
      `Got an HTTP response error from the API: ${error.message}`,
      {
        code: error.response.code,
        statusText: error.response.statusText,
        body: JSON.stringify(error.response.body),
      },
    );

    if (error.response.code === 401 && authStrategy) {
      await authStrategy.handleInvalidAccessTokenError({
        request,
        session,
        error,
      });
    }

    // forward a minimal copy of the upstream HTTP response instead of an Error:
    throw new Response(JSON.stringify(error.response.body), {
      status: error.response.code,
      headers: {
        'Content-Type': error.response.headers!['Content-Type'] as string,
      },
    });
  };
}
