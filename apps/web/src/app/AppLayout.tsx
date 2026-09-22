import { Outlet, ScrollRestoration } from 'react-router-dom';
import styles from './AppLayout.module.css';

/** Casca de todas as telas: fundo vermelho da identidade, 4 px de margem e largura limitada no desktop. */
export function AppLayout() {
  return (
    <div className={styles.app}>
      <Outlet />
      <ScrollRestoration />
    </div>
  );
}
