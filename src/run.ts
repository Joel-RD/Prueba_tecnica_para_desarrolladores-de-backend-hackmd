import app from "./app.js";
import { config } from '../config.js'

const { PORT_SERVER } = config();

app.listen(PORT_SERVER, () => {
    console.log(`Port  running ${PORT_SERVER}\nURL: http://localhost:${PORT_SERVER}`);
})
