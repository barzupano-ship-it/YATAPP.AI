"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const app = (0, app_1.createApp)();
const PORT = env_1.env.PORT;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
