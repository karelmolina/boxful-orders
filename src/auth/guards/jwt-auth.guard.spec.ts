import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should allow access to public routes without token', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const context = createMockExecutionContext(() => {});
    const result = guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      expect.any(Function),
      expect.any(Object),
    ]);
    expect(result).toBe(true);
  });

  it('should call super.canActivate for non-public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const superCanActivate = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockReturnValue(true);

    const context = createMockExecutionContext(() => {});
    const result = guard.canActivate(context);

    expect(superCanActivate).toHaveBeenCalledWith(context);
    expect(result).toBe(true);

    superCanActivate.mockRestore();
  });
});

function createMockExecutionContext(handler: any): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => ({}),
    switchToHttp: () => ({}),
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
    getType: () => 'http',
    getArgs: () => [],
    getArgByIndex: () => null,
  } as unknown as ExecutionContext;
}
