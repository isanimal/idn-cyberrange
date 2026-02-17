<?php

use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment('Cyber range API ready.');
});

Schedule::command('labs:cleanup-expired')
    ->everyMinute()
    ->withoutOverlapping();
