import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
