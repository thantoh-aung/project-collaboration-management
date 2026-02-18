import './bootstrap';
import '../css/app.css';
import './utils/react-fix';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { WorkspaceProvider } from '@/Context/WorkspaceContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <WorkspaceProvider pageProps={props?.initialPage?.props}>
                <App {...props} />
            </WorkspaceProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
