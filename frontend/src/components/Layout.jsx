import Navbar from './Navbar';
import styles from './Layout.module.css';
import usePush from '../hooks/usePush';

export default function Layout({ children }) {
  usePush();
  return (
    <div className={styles.root}>
      <Navbar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
