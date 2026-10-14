/** Mærke på mailvagtens testmails. Står i emnet, så de kan kendes og ryddes. */
export const TEST_EMNE = '[mailvagt]';
export const erVagtMail = (emne: string | null | undefined) => (emne ?? '').toLowerCase().includes(TEST_EMNE);
