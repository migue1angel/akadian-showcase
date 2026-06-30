const { writeFileSync, mkdirSync } = require("fs");
const path = "./src/environments/environment.ts";

const envFileContent = `
export const environment = {
  apiURL: '${process.env.API_URL}',
};
`;

mkdirSync("./src/environments", { recursive: true });

writeFileSync(path, envFileContent);
