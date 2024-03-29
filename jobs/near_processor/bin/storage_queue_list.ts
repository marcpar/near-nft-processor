import { Logger } from "lib/dist/util";
import { GetConfig, LoadConfig } from "../src/config.js";
import {
    QueueServiceClient,
    StorageSharedKeyCredential
} from "@azure/storage-queue";


LoadConfig();

let config = GetConfig();

(async () => {
    let qsClient = new QueueServiceClient(`https://${config.AzureAccountName}.queue.core.windows.net`, new StorageSharedKeyCredential(config.AzureAccountName, config.AzureAccountKey));
    for await (const queue of qsClient.listQueues()) {
        Logger().info(queue.name);
    }
})();

