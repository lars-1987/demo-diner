import { fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { formatCode } from '@/domain/offers';
import { createTestApi, renderApp } from '@/test-utils/renderApp';

/** Auto-confirms the "Redeem now?" dialog. */
function confirmAlerts() {
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((b) => b.text === 'Redeem')?.onPress?.();
  });
}

afterEach(() => jest.restoreAllMocks());

describe('Home', () => {
  it('shows the member and offers once loaded', async () => {
    const { api } = createTestApi();
    await renderApp({ api });

    expect(await screen.findByText('Alex Morgan')).toBeOnTheScreen();
    expect(await screen.findByText('Free loaded fries')).toBeOnTheScreen();
    expect(screen.getByText('3 available')).toBeOnTheScreen();
  });

  it('keeps the member card when only offers fail, and recovers on retry', async () => {
    const { api, failures } = createTestApi();
    failures.add('getOffers:request');
    await renderApp({ api });

    expect(await screen.findByText('Couldn’t load offers')).toBeOnTheScreen();
    expect(screen.getByText('Alex Morgan')).toBeOnTheScreen();

    failures.clear();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Free loaded fries')).toBeOnTheScreen();
    expect(screen.queryByText('Couldn’t load offers')).not.toBeOnTheScreen();
  });

  it('shows an empty state when there are no offers', async () => {
    const { api } = createTestApi();
    // The seeded mock always has offers, so stub an empty response for this case.
    const emptyApi = { ...api, getOffers: async () => [] };
    await renderApp({ api: emptyApi });

    expect(await screen.findByText('No offers right now')).toBeOnTheScreen();
    expect(screen.getByText('0 available')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeOnTheScreen();
  });

  it('shows a single full-screen error when nothing loads, and retries everything', async () => {
    const { api, failures } = createTestApi();
    failures.add('getOffers:request').add('getMember:request');
    await renderApp({ api });

    expect(await screen.findByText('We couldn’t load your rewards')).toBeOnTheScreen();

    failures.clear();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Alex Morgan')).toBeOnTheScreen();
    expect(await screen.findByText('Free loaded fries')).toBeOnTheScreen();
  });
});

describe('Redeeming an offer', () => {
  it('goes from offer detail to a scannable barcode', async () => {
    confirmAlerts();
    const { api } = createTestApi();
    const app = await renderApp({ api, initialUrl: '/offers/loaded-fries' });

    await fireEvent.press(await screen.findByRole('button', { name: 'Redeem offer' }));

    expect(await screen.findByText('Show this at the counter')).toBeOnTheScreen();
    expect(app.getPathname()).toBe('/offers/loaded-fries/code');
    const { redemption } = await api.getOffer('loaded-fries');
    expect(screen.getByText(formatCode(redemption!.code))).toBeOnTheScreen();
    expect(screen.getByTestId('barcode')).toBeOnTheScreen();
  });

  it('shows progress and blocks a second tap while redeeming', async () => {
    confirmAlerts();
    const { api } = createTestApi();
    // Hold the redeem request open so the in-flight state can be inspected.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const redeemOffer = jest.fn(async (id: string, key: string) => {
      await gate;
      return api.redeemOffer(id, key);
    });
    await renderApp({ api: { ...api, redeemOffer }, initialUrl: '/offers/loaded-fries' });

    await fireEvent.press(await screen.findByRole('button', { name: 'Redeem offer' }));
    const pending = await screen.findByRole('button', { name: 'Generating your code…' });
    expect(pending).toBeDisabled();
    await fireEvent.press(pending);
    expect(redeemOffer).toHaveBeenCalledTimes(1);

    release();
    expect(await screen.findByText('Show this at the counter')).toBeOnTheScreen();
  });

  it('recovers the same code when the first response was lost', async () => {
    confirmAlerts();
    const { api, failures } = createTestApi();
    await renderApp({ api, initialUrl: '/offers/loaded-fries' });
    const redeemButton = await screen.findByRole('button', { name: 'Redeem offer' });

    // The server redeems but the response never arrives, and the background
    // refetch fails too, so the guest is left with only "Try again".
    failures.add('redeemOffer:response').add('getOffer:request');
    await fireEvent.press(redeemButton);
    expect(await screen.findByText('Couldn’t redeem this offer')).toBeOnTheScreen();

    failures.clear();
    const serverCode = (await api.getOffer('loaded-fries')).redemption!.code;
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    // Without the idempotency key this retry would fail with ALREADY_REDEEMED.
    expect(await screen.findByText(formatCode(serverCode))).toBeOnTheScreen();
  });

  it('opens a deep link to an expired offer with the action disabled', async () => {
    const { api } = createTestApi();
    await renderApp({ api, initialUrl: '/offers/half-price-pints' });

    expect(await screen.findByText('Half-price pints')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Offer expired' })).toBeDisabled();
  });

  it('shows a friendly not-found state for an unknown deep link', async () => {
    const { api } = createTestApi();
    await renderApp({ api, initialUrl: '/offers/does-not-exist' });

    expect(await screen.findByText('Offer not found')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Back to offers' })).toBeOnTheScreen();
  });
});

describe('Demo tools', () => {
  it('never shows a stale redeemed offer after a reset', async () => {
    confirmAlerts();
    const { api, failures } = createTestApi();
    await renderApp({ api });

    // Redeem, then come back to Home. The offer's detail is now cached as redeemed.
    await fireEvent.press(await screen.findByText('Free loaded fries'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Redeem offer' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Done' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Back' }));

    await fireEvent.press(await screen.findByRole('button', { name: /Demo tools/ }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Reset demo data' }));
    expect(await screen.findByText('3 available')).toBeOnTheScreen();

    // Opening the detail must not rely on its own refetch to correct a stale cache.
    failures.add('getOffer:request');
    await fireEvent.press(await screen.findByText('Free loaded fries'));
    expect(await screen.findByRole('button', { name: 'Redeem offer' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'View your code' })).not.toBeOnTheScreen();
  });

  it('offers a reset once every offer is used, and makes them available again', async () => {
    const { api } = createTestApi();
    await api.redeemOffer('loaded-fries', 'a');
    await api.redeemOffer('thickshake-2-for-1', 'b');
    await api.redeemOffer('ten-off-bill', 'c');
    await renderApp({ api });

    expect(await screen.findByText('You’ve used every offer')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Open demo tools' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Reset demo data' }));

    expect(await screen.findByText('3 available')).toBeOnTheScreen();
    expect(screen.queryByText('You’ve used every offer')).not.toBeOnTheScreen();
  });
});
