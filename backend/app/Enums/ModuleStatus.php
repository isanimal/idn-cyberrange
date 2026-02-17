<?php

namespace App\Enums;

enum ModuleStatus: string
{
    case ACTIVE = 'active';
    case LOCKED = 'locked';
    case DRAFT = 'draft';
}

