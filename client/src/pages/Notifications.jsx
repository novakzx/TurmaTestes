import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useRealtime } from '../store/RealtimeContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { Spinner, Empty, timeAgo } from '../components/ui.jsx';
import {
  IconHeart, IconComment, IconUser, IconChat, IconCalendar, IconFlag, IconBell, FILLED,
} from '../components/Icons.jsx';

const TYPE_META = {
  like: { Icon: IconHeart, cls: 'notif-like', label: 'Gosto' },
  comment: { Icon: IconComment, cls: 'notif-comment', label: 'Comentário' },
  follow: { Icon: IconUser, cls: 'notif-follow', label: 'Seguidor' },
  message: { Icon: IconChat, cls: 'notif-message', label: 'Mensagem' },
  calendar: { Icon: IconCalendar, cls: 'notif-calendar', label: 'Calendário' },
  strike: { Icon: IconFlag, cls: 'notif-strike', label: 'Greve' },
  system: { Icon: IconBell, cls: 'notif-system', label: 'Turma+' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifCount, clearNotifs, setNotifCount } = useRealtime();
  const [items, setItems] = useState(null);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const load = (unread = false) =>
    api.get(`/notifications${unread ? '?unread=1' : ''}`).then((d) => {
      setItems(unread ? d.notifications.filter((n) => !n.read) : d.notifications);
      setNotifCount(d.unread);
    }).catch(() => setItems([]));

  useEffect(() => { load(onlyUnread); }, [onlyUnread]); // eslint-disable-line

  const markAll = async () => {
    await api.post('/notifications/read');
    clearNotifs();
    load(onlyUnread);
  };

  const open = (n) => {
    if (!n.read) {
      setItems((arr) => arr.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setNotifCount((c) => Math.max(0, c - 1));
      api.post('/notifications/read').catch(() => {}); // simplificação: marca tudo
    }
    if (n.url) navigate(n.url);
  };

  return (
    <div className="page">
      <div className="page-head spread">
        <div>
          <h1>Notificações</h1>
          <p>{notifCount > 0 ? `${notifCount} por ler` : 'Tudo em dia'}</p>
        </div>
        <div className="row">
          <button className={`chip ${onlyUnread ? 'chip-active' : ''}`} onClick={() => setOnlyUnread((v) => !v)}>Só por ler</button>
          <button className="btn btn-ghost btn-sm" onClick={markAll}>Marcar todas</button>
        </div>
      </div>

      <div className="card" style={{ padding: 6 }}>
        {items === null ? (
          <div className="block-loader"><Spinner size={26} /></div>
        ) : items.length === 0 ? (
          <Empty icon={<IconBell size={40} />} title="Sem notificações" hint="Quando alguém interagir contigo, vês aqui." />
        ) : (
          items.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            return (
              <button key={n.id} className={`notif-item ${!n.read ? 'notif-unread' : ''}`} onClick={() => open(n)}>
                {n.actor ? (
                  <Avatar user={n.actor} size={36} />
                ) : (
                  <span className={`notif-icon ${meta.cls}`}><meta.Icon size={17} /></span>
                )}
                <span className="col" style={{ minWidth: 0 }}>
                  <span className="notif-text">
                    <span className={`notif-icon ${meta.cls}`} style={{ display: 'inline-flex', width: 20, height: 20, verticalAlign: '-5px', marginRight: 6 }}>
                      <meta.Icon size={11} />
                    </span>
                    {n.text}
                  </span>
                  <span className="notif-time">{timeAgo(n.createdAt)} · {meta.label}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
