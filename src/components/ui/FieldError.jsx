export default function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-coral">{message}</p>
}
