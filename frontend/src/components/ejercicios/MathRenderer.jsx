import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * Renderiza texto con fórmulas LaTeX.
 * Las fórmulas inline van entre $...$ y las de bloque entre $$...$$
 * Ejemplo: "El valor de $x^2 + 1$ es siempre positivo"
 */
export default function MathRenderer({ texto = '', className = '' }) {
  if (!texto) return null;

  // Divide el texto en partes: texto normal, fórmulas inline $...$ y bloque $$...$$
  const partes = [];
  let restante = texto;
  let clave = 0;

  while (restante.length > 0) {
    // Busca fórmula de bloque $$...$$
    const inicioBloque = restante.indexOf('$$');
    if (inicioBloque !== -1) {
      const finBloque = restante.indexOf('$$', inicioBloque + 2);
      if (finBloque !== -1) {
        // Texto antes del bloque
        if (inicioBloque > 0) {
          partes.push(
            <span key={clave++}>{restante.substring(0, inicioBloque)}</span>
          );
        }
        // Fórmula de bloque
        const formula = restante.substring(inicioBloque + 2, finBloque);
        partes.push(
          <BlockMath key={clave++} math={formula} />
        );
        restante = restante.substring(finBloque + 2);
        continue;
      }
    }

    // Busca fórmula inline $...$
    const inicioInline = restante.indexOf('$');
    if (inicioInline !== -1) {
      const finInline = restante.indexOf('$', inicioInline + 1);
      if (finInline !== -1) {
        // Texto antes de la fórmula
        if (inicioInline > 0) {
          partes.push(
            <span key={clave++}>{restante.substring(0, inicioInline)}</span>
          );
        }
        // Fórmula inline
        const formula = restante.substring(inicioInline + 1, finInline);
        partes.push(
          <InlineMath key={clave++} math={formula} />
        );
        restante = restante.substring(finInline + 1);
        continue;
      }
    }

    // Sin más fórmulas — agrega el resto como texto normal
    partes.push(<span key={clave++}>{restante}</span>);
    break;
  }

  return <span className={className}>{partes}</span>;
}