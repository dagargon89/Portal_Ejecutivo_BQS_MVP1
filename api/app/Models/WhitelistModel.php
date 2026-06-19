<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * AUTH_WHITELIST — lista blanca de correos autorizados (segunda barrera).
 */
class WhitelistModel extends Model
{
    protected $table = 'AUTH_WHITELIST';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = false; // `creado_en` lo fija la BD (DEFAULT CURRENT_TIMESTAMP)
    protected $allowedFields = ['correo', 'activo', 'creado_por'];

    protected $validationRules = [
        'correo' => 'required|valid_email|max_length[255]|is_unique[AUTH_WHITELIST.correo,id,{id}]',
        'activo' => 'permit_empty|in_list[0,1]',
    ];

    protected $validationMessages = [
        'correo' => [
            'is_unique' => 'El correo ya existe en la whitelist.',
            'valid_email' => 'El correo no tiene un formato valido.',
        ],
    ];

    /**
     * Segunda barrera de acceso: el correo debe existir y estar activo.
     * La collation utf8mb4_0900_ai_ci hace la comparacion case-insensitive.
     */
    public function estaAutorizado(string $correo): bool
    {
        $correo = strtolower(trim($correo));
        if ($correo === '') {
            return false;
        }

        return $this->where('correo', $correo)
            ->where('activo', 1)
            ->countAllResults() > 0;
    }

    /**
     * Normaliza el correo a minusculas antes de insertar/actualizar.
     *
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    protected function normalizarCorreo(array $data): array
    {
        if (isset($data['data']['correo'])) {
            $data['data']['correo'] = strtolower(trim((string) $data['data']['correo']));
        }

        return $data;
    }

    protected $beforeInsert = ['normalizarCorreo'];
    protected $beforeUpdate = ['normalizarCorreo'];
}
