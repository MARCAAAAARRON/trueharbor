<?php

namespace App\Console\Commands;

use App\Services\OrderService;
use Illuminate\Console\Command;

class ExpirePendingOrdersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:expire-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire pending orders older than 30 minutes and restore inventory';

    /**
     * Execute the console command.
     */
    public function handle(OrderService $orderService): int
    {
        $count = $orderService->expirePendingOrders();
        $this->info("Successfully expired {$count} pending order(s) and restored inventory.");

        return Command::SUCCESS;
    }
}
