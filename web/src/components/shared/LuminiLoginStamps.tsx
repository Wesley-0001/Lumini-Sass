import { useRef, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'

const STAMPS: { cls: string; ref: string; img: string; style: CSSProperties }[] = [
  { cls: 'stamp-tl', ref: 'AD0901', img: 'stamp-1.jpg', style: { '--size': '145px', '--dur': '7s', '--delay': '0s', '--rot': '-14deg' } as CSSProperties },
  { cls: 'stamp-ml', ref: 'AD1341', img: 'stamp-2.jpg', style: { '--size': '140px', '--dur': '8s', '--delay': '-3s', '--rot': '8deg' } as CSSProperties },
  { cls: 'stamp-bl', ref: 'NT8479', img: 'stamp-3.jpg', style: { '--size': '138px', '--dur': '10s', '--delay': '-1s', '--rot': '-10deg' } as CSSProperties },
  { cls: 'stamp-tr', ref: 'NT8023', img: 'stamp-4.jpg', style: { '--size': '148px', '--dur': '9s', '--delay': '-2s', '--rot': '11deg' } as CSSProperties },
  { cls: 'stamp-mr', ref: 'AD2339', img: 'stamp-5.jpg', style: { '--size': '135px', '--dur': '11s', '--delay': '-5s', '--rot': '6deg' } as CSSProperties },
  { cls: 'stamp-br', ref: 'NT6785', img: 'stamp-6.jpg', style: { '--size': '142px', '--dur': '8.5s', '--delay': '-4s', '--rot': '-8deg' } as CSSProperties },
]

/** Efeito “chiclete”: retorno com leve pós-oscilação, sem fuga de momentum longa */
const DRAG_RETURN_SPRING = {
  type: 'spring' as const,
  stiffness: 240,
  damping: 19,
  mass: 0.75,
  restDelta: 0.2,
  restSpeed: 0.2,
}

type Props = {
  /** Só o login staff do index legado usa `stamps-container` por id. */
  id?: string
  /** Classe adicional no container (ex.: estáticas no React, paridade com `app.js` no legado) */
  containerClassName?: string
  'aria-hidden'?: boolean
  /** Estampa de imagem: login staff usa alt com código; portal usa string vazia (portal.html) */
  altForStamp?: (code: string) => string
}

/**
 * Seis estampas flutuantes — paridade com `index.html` (staff) e `portal.html` (portal).
 * Arraste com elasticidade (limites) e retorno com spring; flutuação CSS no filho para não conflitar com o transform.
 */
export function LuminiLoginStamps({ id, containerClassName, 'aria-hidden': ariaHidden, altForStamp }: Props) {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const [draggingCode, setDraggingCode] = useState<string | null>(null)

  return (
    <div
      ref={constraintsRef}
      className={['stamps-container', containerClassName].filter(Boolean).join(' ')}
      {...(id ? { id } : {})}
      aria-hidden={ariaHidden}
    >
      {STAMPS.map((s) => {
        const isDragging = draggingCode === s.ref
        return (
          <motion.div
            key={s.ref}
            className={['stamp-float', 'stamp-float--drag-layer', s.cls, isDragging ? 'dragging' : ''].filter(Boolean).join(' ')}
            data-ref={s.ref}
            style={s.style}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.14}
            dragSnapToOrigin
            dragMomentum={false}
            dragTransition={DRAG_RETURN_SPRING}
            onDragStart={() => {
              setDraggingCode(s.ref)
            }}
            onDragEnd={() => {
              setDraggingCode(null)
            }}
          >
            <div className="stamp-float--drag-bob" style={s.style}>
              <div className="stamp-img-wrap">
                <img
                  src={`/images/${s.img}`}
                  alt={altForStamp != null ? altForStamp(s.ref) : ''}
                  draggable={false}
                />
              </div>
              <div className="stamp-ref">{s.ref}</div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
