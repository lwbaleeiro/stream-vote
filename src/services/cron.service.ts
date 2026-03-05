import { pollService } from "../polls/poll.service";

class CronService {
    private timer: Timer | null = null;
    private readonly INTERVAL_MS = 5 * 60 * 1000;

    start() {
        if (this.timer) return;

        console.log("[Cron] Service started. Running every 5 minutes.");
        
        this.run();

        this.timer = setInterval(() => {
            this.run();
        }, this.INTERVAL_MS);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private async run() {
        console.log(`[Cron] Heartbeat at ${new Date().toISOString()}`);
        
        try {
            await pollService.checkExpiredPolls();
            
            await pollService.resolveEventPolls();
            
        } catch (error) {
            console.error("[Cron] Error during execution:", error);
        }
    }
}

export const cronService = new CronService();
