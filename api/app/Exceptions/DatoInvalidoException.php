<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

/**
 * Se lanza cuando un valor de la importacion no puede sanearse (texto en un
 * campo numerico, negativo, "N/A", etc.) — RF-ADM-02.
 */
class DatoInvalidoException extends RuntimeException
{
}
