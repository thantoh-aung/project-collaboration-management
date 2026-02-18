import { Container } from '@mantine/core';

export default function GuestLayout({ children }) {
    return (
        <Container size="xs" py="xl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            {children}
        </Container>
    );
}
