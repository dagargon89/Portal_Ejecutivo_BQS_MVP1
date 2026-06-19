<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * CLIENTE_ALIAS — mapa determinista alias_norm -> ID_Cliente (M-08).
 */
class ClienteAliasModel extends Model
{
    protected $table = 'CLIENTE_ALIAS';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = ['alias_norm', 'alias_original', 'ID_Cliente'];

    /**
     * Devuelve el ID_Cliente asociado a un alias normalizado, o null.
     */
    public function resolver(string $aliasNorm): ?string
    {
        $row = $this->where('alias_norm', $aliasNorm)->first();

        return $row === null ? null : (string) $row['ID_Cliente'];
    }

    /**
     * Registra (idempotente) un alias -> ID_Cliente, conservando el texto
     * original para auditoria/reversibilidad.
     */
    public function registrar(string $aliasNorm, string $aliasOriginal, string $idCliente): void
    {
        $existente = $this->where('alias_norm', $aliasNorm)->first();

        if ($existente === null) {
            $this->insert([
                'alias_norm' => $aliasNorm,
                'alias_original' => $aliasOriginal,
                'ID_Cliente' => $idCliente,
            ]);

            return;
        }

        $this->update($existente['id'], [
            'alias_original' => $aliasOriginal,
            'ID_Cliente' => $idCliente,
        ]);
    }
}
