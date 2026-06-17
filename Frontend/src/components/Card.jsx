import './Card.css';

export function Card({ title, interactive = false, className = '', children, ...rest }) {
  const classes = ['card', interactive ? 'card--interactive' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classes} {...rest}>
      {title && <h2 className="card__title">{title}</h2>}
      <div className="card__body">{children}</div>
    </article>
  );
}

export default Card;
