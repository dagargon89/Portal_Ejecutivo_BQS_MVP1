<?php

declare(strict_types=1);

/**
 * Estilo de codigo del backend (PSR-12 + reglas seguras, no-risky).
 * Uso: composer cs-fix  |  composer cs-check (en CI, --dry-run).
 */
$finder = PhpCsFixer\Finder::create()
    ->in([__DIR__ . '/app', __DIR__ . '/tests'])
    ->exclude(['Views'])
    ->notPath('Config/Auth.php')
    ->notPath('Config/AuthGroups.php')
    ->notPath('Config/AuthToken.php');

return (new PhpCsFixer\Config())
    ->setRiskyAllowed(false)
    ->setRules([
        '@PSR12'                       => true,
        'array_syntax'                 => ['syntax' => 'short'],
        'ordered_imports'              => ['sort_algorithm' => 'alpha'],
        'no_unused_imports'            => true,
        'no_extra_blank_lines'         => true,
        'single_quote'                 => true,
        'trailing_comma_in_multiline'  => true,
        'binary_operator_spaces'       => ['default' => 'single_space'],
        'concat_space'                 => ['spacing' => 'one'],
    ])
    ->setFinder($finder);
