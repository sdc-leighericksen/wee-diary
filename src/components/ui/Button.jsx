import './Button.css'

export default function Button({ children, variant = 'primary', size = 'md', fullWidth, ...props }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''}`}
      {...props}
    >
      {children}
    </button>
  )
}
