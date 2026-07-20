import { component$, useContext, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { GlobalStoreContext } from '../../store';

export const SubscribePopup = component$(() => {
  const store = useContext(GlobalStoreContext);
  const isVisible = useSignal(false);
  const submitted = useSignal(false);

  useVisibleTask$(() => {
    if (store.popupDismissed) return;

    // show after idle time or scrolling
    const timer = setTimeout(() => {
      if (!store.popupDismissed) isVisible.value = true;
    }, 5000);

    const handleScroll = () => {
      if (store.popupDismissed) return;
      if (window.scrollY > document.body.scrollHeight / 2) {
        isVisible.value = true;
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  });

  if (!isVisible.value) return null;

  return (
    <div id="oa-popup" class="oa-popup fixed inset-0 flex items-center justify-center bg-black/50 z-[100]" aria-hidden="false">
      <div class="oa-popup__panel bg-white p-8 max-w-sm w-full relative" role="dialog" aria-label="Subscribe popup">
        <button
          type="button"
          class="oa-popup__close absolute top-4 right-4 text-2xl leading-none"
          aria-label="Close"
          onClick$={() => {
            isVisible.value = false;
            store.popupDismissed = true;
          }}
        >×</button>
        <p class="oa-popup__title text-xl font-serif mb-6 pr-8">Subscribe and receive 10% off your first piece</p>

        {!submitted.value ? (
          <form id="oa-popup-form" class="oa-popup__form flex flex-col gap-4" onSubmit$={(e) => {
             e.preventDefault();
             submitted.value = true;
             setTimeout(() => {
               isVisible.value = false;
               store.popupDismissed = true;
             }, 2000);
          }}>
            <label class="sr-only" for="sub_email">Email</label>
            <input id="sub_email" type="email" name="email" placeholder="email" required autocomplete="email" class="input input-bordered rounded-none" />
            <label class="sr-only" for="sub_name">Name</label>
            <input id="sub_name" type="text" name="name" placeholder="name" autocomplete="name" class="input input-bordered rounded-none" />
            <button type="submit" class="btn btn-neutral rounded-none text-white w-full uppercase tracking-widest text-xs">subscribe →</button>
          </form>
        ) : (
          <p id="oa-popup-success" class="oa-popup__success font-bold text-green-700 mt-4" aria-live="polite">you're on the list.</p>
        )}
      </div>
    </div>
  );
});
