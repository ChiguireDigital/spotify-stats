export default function ErrorState({ message = 'No pudimos cargar esta información.' }) {
  return <p className="section-message error-state" role="alert">{message}</p>;
}
