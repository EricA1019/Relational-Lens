export {};

import '../../../../public/global';
import '../../../../global';

declare global {
  var relationalLensGenerateInterceptor:
    | ((
        chat: unknown[],
        contextSize: number,
        abort: (reason?: string) => void,
        generationType?: string,
      ) => Promise<void>)
    | undefined;
}
