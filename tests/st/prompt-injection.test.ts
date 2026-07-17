import { jest } from '@jest/globals';

// Mock the ST context
const mockSetExtensionPrompt = jest.fn<(...args: any[]) => any>();
jest.unstable_mockModule('../../src/st/context.js', () => ({
  getStContext: () => ({
    setExtensionPrompt: mockSetExtensionPrompt,
  }),
}));

// Mock compileSceneBrief to return a predictable string
jest.unstable_mockModule('../../src/domain/brief-compiler.js', () => ({
  compileSceneBrief: () => 'compiled brief content',
}));

const { DYNAMIC_PROMPT_KEY, WRITER_CONTRACT_PROMPT_KEY } = await import('../../src/constants.js');
const { injectSceneBrief, clearAllPrompts } = await import('../../src/st/prompt-injection.js');

beforeEach(() => {
  mockSetExtensionPrompt.mockClear();
});

test('injectSceneBrief calls setExtensionPrompt twice', () => {
  injectSceneBrief({
    immediateAim: 'Aim',
    stance: 'Stance',
    relevantConstraints: [],
    expressionGuidance: [],
  });
  expect(mockSetExtensionPrompt).toHaveBeenCalledTimes(2);
});

test('injectSceneBrief sets writer contract with correct key', () => {
  injectSceneBrief({
    immediateAim: 'Aim',
    stance: 'Stance',
    relevantConstraints: [],
    expressionGuidance: [],
  });
  expect(mockSetExtensionPrompt).toHaveBeenCalledWith(
    WRITER_CONTRACT_PROMPT_KEY,
    expect.any(String),
    expect.any(Number),
    expect.any(Number),
    false,
    expect.any(Number),
  );
});

test('injectSceneBrief sets dynamic brief with correct key', () => {
  injectSceneBrief({
    immediateAim: 'Aim',
    stance: 'Stance',
    relevantConstraints: [],
    expressionGuidance: [],
  });
  expect(mockSetExtensionPrompt).toHaveBeenCalledWith(
    DYNAMIC_PROMPT_KEY,
    expect.any(String),
    expect.any(Number),
    expect.any(Number),
    false,
    expect.any(Number),
  );
});

test('clearAllPrompts clears both prompt keys', () => {
  clearAllPrompts();
  expect(mockSetExtensionPrompt).toHaveBeenCalledWith(DYNAMIC_PROMPT_KEY, '', 0, 0);
  expect(mockSetExtensionPrompt).toHaveBeenCalledWith(WRITER_CONTRACT_PROMPT_KEY, '', 0, 0);
});
