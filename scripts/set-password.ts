import { AccountError, setPasswordByEmail } from "../src/server/accounts/users";

function arg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return "";
  return String(process.argv[index + 1] ?? "");
}

async function main() {
  const email = arg("--email");
  const password = arg("--password");
  if (!email || !password) {
    console.error(
      "Usage: npm run account:set-password -- --email you@example.com --password 'at-least-8-chars'",
    );
    process.exit(1);
  }

  const user = await setPasswordByEmail(email, password);
  console.info(`Password updated for ${user.email}.`);
}

main().catch((error) => {
  const message = error instanceof AccountError ? error.message : "Could not update the password.";
  console.error(message);
  process.exit(1);
});
