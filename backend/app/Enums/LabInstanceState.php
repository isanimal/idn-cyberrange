<?php

namespace App\Enums;

enum LabInstanceState: string
{
    case INACTIVE = 'INACTIVE';
    case ACTIVE = 'ACTIVE';
    case PAUSED = 'PAUSED';
    case COMPLETED = 'COMPLETED';
    case ABANDONED = 'ABANDONED';
}
