<?php

declare(strict_types=1);

namespace App\Controllers;

use CodeIgniter\Controller;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Psr\Log\LoggerInterface;
use RuntimeException;

/**
 * Controlador base de la API. Centraliza el envelope de respuesta del 05 §1.4:
 *   exito  -> { "data": ... }  (+ "meta" en colecciones)
 *   error  -> { "error": { "code", "message", "fields"? } }
 */
abstract class BaseApiController extends Controller
{
    /** @var list<string> */
    protected $helpers = ['auth'];

    public function initController(RequestInterface $request, ResponseInterface $response, LoggerInterface $logger): void
    {
        parent::initController($request, $response, $logger);
        $this->response->setContentType('application/json');
    }

    /**
     * Devuelve la peticion HTTP entrante con su tipo concreto (la API nunca
     * corre como CLIRequest). Narrowing real, no override de tipos.
     */
    protected function req(): IncomingRequest
    {
        $request = $this->request;
        if (! $request instanceof IncomingRequest) {
            throw new RuntimeException('Se esperaba una peticion HTTP entrante.');
        }

        return $request;
    }

    /**
     * Lee un campo de entrada de forma robusta: primero del cuerpo JSON y, si
     * no, de los datos de formulario/query.
     *
     * @param mixed $default
     *
     * @return mixed
     */
    protected function input(string $key, $default = null)
    {
        $json = $this->req()->getJSON(true);
        if (is_array($json) && array_key_exists($key, $json)) {
            return $json[$key];
        }

        return $this->req()->getVar($key) ?? $default;
    }

    protected function queryInt(string $key, int $default): int
    {
        $value = $this->req()->getGet($key);

        return is_numeric($value) ? (int) $value : $default;
    }

    /**
     * @param mixed                    $data
     * @param array<string,mixed>|null $meta
     */
    protected function ok($data, int $status = ResponseInterface::HTTP_OK, ?array $meta = null): ResponseInterface
    {
        $payload = ['data' => $data];
        if ($meta !== null) {
            $payload['meta'] = $meta;
        }

        return $this->response->setStatusCode($status)->setJSON($payload);
    }

    /**
     * @param mixed $data
     */
    protected function created($data): ResponseInterface
    {
        return $this->ok($data, ResponseInterface::HTTP_CREATED);
    }

    protected function noContent(): ResponseInterface
    {
        return $this->response->setStatusCode(ResponseInterface::HTTP_NO_CONTENT);
    }

    /**
     * @param array<string,string>|null $fields
     */
    protected function error(string $code, string $message, int $status, ?array $fields = null): ResponseInterface
    {
        $error = ['code' => $code, 'message' => $message];
        if ($fields !== null) {
            $error['fields'] = $fields;
        }

        return $this->response->setStatusCode($status)->setJSON(['error' => $error]);
    }

    /**
     * @param array<string,string> $fields
     */
    protected function validationError(array $fields, string $message = 'Datos invalidos.'): ResponseInterface
    {
        return $this->error('VALIDATION', $message, ResponseInterface::HTTP_UNPROCESSABLE_ENTITY, $fields);
    }

    protected function forbidden(string $message = 'No tiene permiso para esta accion.'): ResponseInterface
    {
        return $this->error('FORBIDDEN', $message, ResponseInterface::HTTP_FORBIDDEN);
    }

    protected function notFound(string $message = 'Recurso no encontrado.'): ResponseInterface
    {
        return $this->error('NOT_FOUND', $message, ResponseInterface::HTTP_NOT_FOUND);
    }
}
