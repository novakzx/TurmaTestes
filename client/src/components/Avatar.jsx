/** Avatar plano com iniciais (sem imagens externas — rápido e consistente). */
export default function Avatar({ user, size = 40, ring = false, style = {} }) {
  if (!user) return null;
  const name = user.displayName || user.username || '?';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
  return (
    <span
      className={`avatar ${ring ? 'avatar-ring' : ''}`}
      style={{ width: size, height: size, background: user.avatarColor || '#16A34A', fontSize: Math.round(size * 0.38), ...style }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
