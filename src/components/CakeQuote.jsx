import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Field, TextInput, TextArea } from './Field'
import { Button } from './ui'
import { useCatalog } from '../context/CatalogContext'
import { fromPrice } from '../data/catalog'
import { isoDaysFromNow, money } from '../lib/format'

/** Custom cakes are enquiries; their starting price is never a checkout total. */
export default function CakeQuote({ product }) {
  const { contact } = useCatalog()
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState('')
  const [message, setMessage] = useState('')
  const [ideas, setIdeas] = useState('')
  const startingPrice = fromPrice(product)
  const text = [
    `Hello Dussa BakeLab! I would like a quote for a ${product.name.toLowerCase()}.`,
    date && `Date: ${date}`,
    guests && `Approximate guests: ${guests}`,
    message.trim() && `Cake message: ${message.trim()}`,
    ideas.trim() && `Ideas and requests: ${ideas.trim()}`,
    'Please confirm available flavours, the size, design and final price with me.',
  ].filter(Boolean).join('\n')

  return (
    <div className="mt-9 space-y-6 rounded-[1.5rem] border border-caramel/25 bg-porcelain p-5 sm:p-7">
      <div>
        <p className="eyebrow text-caramel">{startingPrice ? 'Starts from' : 'Made to order'}</p>
        <p className="mt-2 font-display text-[2rem] leading-tight text-espresso">
          {startingPrice ? money(startingPrice) : 'Let’s plan your cake'}
        </p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-cocoa/75">
          {startingPrice
            ? 'The final price depends on the size and design. Share a few details and we will prepare a quote.'
            : 'Tell us about your wedding. We will discuss the size, design and price with you.'}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date (if known)" htmlFor="quote-date">
          <TextInput id="quote-date" type="date" min={isoDaysFromNow()} value={date} onChange={e => setDate(e.target.value)} />
        </Field>
        <Field label="Approximate guests" htmlFor="quote-guests">
          <TextInput id="quote-guests" type="number" min="1" max="5000" placeholder="How many people?" value={guests} onChange={e => setGuests(e.target.value)} />
        </Field>
      </div>
      {product.allowsMessage && <Field label="Message on the cake (optional)" htmlFor="quote-message">
        <TextInput id="quote-message" maxLength={60} placeholder="Happy Birthday, Keza!" value={message} onChange={e => setMessage(e.target.value)} />
      </Field>}
      <Field label="Your cake ideas" htmlFor="quote-ideas">
        <TextArea id="quote-ideas" maxLength={1500} placeholder="Tell us your theme, colours, preferred flavour or any design ideas. You can send reference photos on WhatsApp." value={ideas} onChange={e => setIdeas(e.target.value)} />
      </Field>
      <Button href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`} size="lg" className="w-full" sheen>
        <MessageCircle size={18} /> Request quote on WhatsApp
      </Button>
      <p className="text-center text-[0.78rem] leading-relaxed text-cocoa/72">
        This opens a message for you to send. Your date and final price will be confirmed with the bakery.
      </p>
    </div>
  )
}
