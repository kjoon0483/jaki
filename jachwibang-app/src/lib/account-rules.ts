/** Rules shared by sign-up and the My Page edit forms. */
export const MIN_PASSWORD_LEN = 8;
export const PASSWORD_SPECIAL_RE = /[!-/:-@[-`{-~]/;
export const MIN_NICKNAME_LEN = 2;
export const MAX_NICKNAME_LEN = 12;

/** Returns an error message, or null when the password is acceptable. */
export function passwordProblem(password: string) {
  if (password.length < MIN_PASSWORD_LEN) return `${MIN_PASSWORD_LEN}자 이상 입력해주세요.`;
  if (!PASSWORD_SPECIAL_RE.test(password)) return '특수문자를 1자 이상 포함해주세요.';
  return null;
}

export function nicknameProblem(nickname: string) {
  const n = nickname.trim();
  if (n.length < MIN_NICKNAME_LEN || n.length > MAX_NICKNAME_LEN) {
    return `닉네임은 ${MIN_NICKNAME_LEN}~${MAX_NICKNAME_LEN}자로 입력해주세요.`;
  }
  return null;
}
