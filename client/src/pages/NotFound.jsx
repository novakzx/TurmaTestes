import { Link } from 'react-router-dom';
import { Empty } from '../components/ui.jsx';
import { IconSearch } from '../components/Icons.jsx';

export default function NotFound() {
  return (
    <div className="page">
      <Empty
        icon={<IconSearch size={40} />}
        title="Página não encontrada"
        hint="O endereço pode ter mudado ou nunca existiu."
      />
      <p className="center">
        <Link to="/" className="btn btn-primary">Voltar ao início</Link>
      </p>
    </div>
  );
}
