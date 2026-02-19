import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

/**
 * SanitizePipe — Prevenção global contra XSS
 *
 * Varre recursivamente todos os campos string do body da requisição
 * e remove tags perigosas (<script>, <iframe>, <object>, etc.),
 * preservando formatação básica segura (<b>, <i>, <em>, <strong>,
 * <br>, <p>, <ul>, <ol>, <li>, <a>).
 *
 * Aplicado globalmente no main.ts ANTES do ValidationPipe:
 *   app.useGlobalPipes(new SanitizePipe(), new ValidationPipe({...}));
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
      private readonly sanitizeOptions: sanitizeHtml.IOptions = {
            // Tags seguras permitidas (formatação básica de texto rico)
            allowedTags: [
                  'b', 'i', 'em', 'strong', 'u', 's',
                  'p', 'br', 'hr',
                  'ul', 'ol', 'li',
                  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                  'blockquote', 'code', 'pre',
                  'a', 'span',
            ],
            // Atributos permitidos (apenas href em links)
            allowedAttributes: {
                  a: ['href', 'title', 'target', 'rel'],
                  span: ['class'],
            },
            // Força rel="noopener noreferrer" e target="_blank" em links
            transformTags: {
                  a: sanitizeHtml.simpleTransform('a', {
                        target: '_blank',
                        rel: 'noopener noreferrer',
                  }),
            },
            // Protocolos seguros (bloqueia javascript:, data:, etc.)
            allowedSchemes: ['http', 'https', 'mailto'],
            // Remove tags perigosas completamente (não apenas strip)
            disallowedTagsMode: 'discard',
      };

      transform(value: any, metadata: ArgumentMetadata): any {
            // Só sanitiza body (não params, query, ou custom)
            if (metadata.type !== 'body') {
                  return value;
            }

            return this.sanitizeValue(value);
      }

      /**
       * Sanitiza recursivamente: strings, arrays e objetos
       */
      private sanitizeValue(value: any): any {
            // String → sanitiza diretamente
            if (typeof value === 'string') {
                  return sanitizeHtml(value, this.sanitizeOptions).trim();
            }

            // Array → sanitiza cada item
            if (Array.isArray(value)) {
                  return value.map((item) => this.sanitizeValue(item));
            }

            // Objeto → sanitiza cada propriedade recursivamente
            if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
                  const sanitized: Record<string, any> = {};
                  for (const [key, val] of Object.entries(value)) {
                        sanitized[key] = this.sanitizeValue(val);
                  }
                  return sanitized;
            }

            // Números, booleans, null, Date → retorna como está
            return value;
      }
}
