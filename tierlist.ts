const buildTier = (value: string) => {
    const div = document.createElement('div');
    const valueBox = document.createElement('button');
    valueBox.type = 'button';
    valueBox.textContent = value;

    const itemsBox = document.createElement('div');
    itemsBox.className = 'drop';

    div.append(valueBox, itemsBox)
    return div;
};

type TItem = {
    // div: HTMLDivElement;
    img: HTMLImageElement;
    name: string;
}

const buildDraggableItem = (item: TItem) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.append(item.img);
    const placeholder = document.createElement('div');
    placeholder.className = 'item';
    let offsetX = 0;
    let offsetY = 0;

    // Needs like drop coordinate, not just container.
    // Then place the placeholder there, and replace it
    const dropPlaceholder = (e: PointerEvent) => {
        const elementsFromPoint = document.elementsFromPoint(e.clientX, e.clientY);
        const parent = elementsFromPoint.find(el => el.classList.contains('drop')) as HTMLDivElement | undefined;
        if (!parent) return;
        if (!parent.children.length) return parent.append(placeholder);
        let closest = { el: parent.children[0], distanceX: Number.MAX_SAFE_INTEGER };
        // Children is immediately populated with placeholder, so might have to filter, or find smarter way
        // Need to introduce y coordinates, or else second row doesn't work
        let method: 'before' | 'after' = 'before';
        for (const el of parent.children) {
            const rect = el.getBoundingClientRect();
            const width = rect.right - rect.left;
            const center = width / 2 + rect.left;
            const distanceX = Math.abs(center - e.clientX);

            // NEEDS distanceY to get correct row
            if (distanceX < closest.distanceX) {
                closest = { el, distanceX };
                // Determine whether rect right or rect left is closer
                const distanceToRight = Math.abs(rect.right - e.clientX);
                const distanceToLeft = Math.abs(rect.left - e.clientX);
                // Maybe can do this immediately because "center" might not be necessary
                // Or you find closest distanceLeft and closest distanceRight and put it in between
                method = distanceToRight > distanceToLeft ? 'before' : 'after';
            }
        }
        closest.el[method](placeholder);
    };
    const handleDown = (e: PointerEvent) => {
        e.preventDefault();
        const rect = div.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp, { once: true });
    };

    const handleMove = (e: PointerEvent) => {
        main.append(div);
        div.style.position = 'absolute';
        div.style.left = `${e.clientX - offsetX}px`;
        div.style.top = `${e.clientY - offsetY}px`;
        div.classList.add('drag');
        dropPlaceholder(e);
    };



    const handleUp = () => {
        placeholder.replaceWith(div);
        div.style.position = '';
        div.style.left = '';
        div.style.top = '';
        div.classList.remove('drag');
        window.removeEventListener('pointermove', handleMove);
    };

    div.addEventListener('pointerdown', handleDown);

    div.addEventListener('dblclick', () => addItemDialog(item));

    return div;
};

// Needs to be able to accept an item
const addItemDialog = (item?: TItem) => {
    const { promise, resolve } = Promise.withResolvers<TItem | null>();

    const dialog = document.createElement('dialog');
    const form = document.createElement('form');
    const id = `_${crypto.randomUUID()}`;

    let img: HTMLImageElement | null = item ? item.img.cloneNode() as HTMLImageElement : null;

    const addImageButton = document.createElement('button');
    addImageButton.type = 'button';
    addImageButton.textContent = 'Select Image';
    addImageButton.className = 'add-image-button';
    addImageButton.addEventListener('click', async () => {
        img = await imagePrompt();
        if (!img) {
            submitButton.disabled = true;
            return;
        };
        inputWrapper.after(img);
        submitButton.disabled = false;
    });

    const clearImageButton = document.createElement('button');
    clearImageButton.type = 'button';
    clearImageButton.textContent = 'Clear';
    clearImageButton.className = 'clear-image-button';
    clearImageButton.addEventListener('click', () => {
        submitButton.disabled = true;
        input.value = '';
        img?.remove();
        img = null;
    });

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Name';

    const input = document.createElement('input');
    input.id = id;
    input.type = 'text';
    input.maxLength = 40;
    input.required = true;
    input.pattern = '\\S.*'

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';
    inputWrapper.replaceChildren(label, input);

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => dialog.remove());

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'OK';
    submitButton.disabled = !item;

    const content = document.createElement('div');
    content.className = 'form-content';
    content.replaceChildren(addImageButton, inputWrapper, clearImageButton);

    const buttonRow = document.createElement('div');
    buttonRow.className = 'button-row';
    buttonRow.replaceChildren(cancelButton, submitButton);

    if (item && img) {
        inputWrapper.after(img);
        input.value = item.name;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        dialog.remove();
        const name = input.value?.trim() ?? '';
        if (!img || !name) {
            resolve(null);
        }
        else {
            if (item) {
                item.img.replaceWith(img);
                item.img = img;
                item.name = name;
            }
            resolve({
                img,
                name
            });
        }

    });

    dialog.addEventListener('cancel', () => {
        dialog.remove();
        resolve(null);
    });

    form.replaceChildren(content, buttonRow);
    dialog.replaceChildren(form);

    container.append(dialog);
    dialog.showModal();

    return promise;
};


const container = document.createElement('div');
container.className = 'sw-tier-list sw-theme';

const defaultTiers = ['S', 'A', 'B', 'C', 'D', 'F'];
const tiers = new Set(defaultTiers.map(t => buildTier(t)));

const main = document.createElement('main');

const unusedItemsRow = document.createElement('div');
unusedItemsRow.className = 'drop';


const openDialogButton = document.createElement('button');
openDialogButton.type = 'button';
openDialogButton.className = 'solid';
openDialogButton.textContent = 'Add Item';
openDialogButton.addEventListener('click', async () => {
    const item = await addItemDialog();
    if (!item) return;
    unusedItemsRow.append(buildDraggableItem(item));
});



const getImageFromFile = (file: File) => {
    const reader = new FileReader();
    const img = document.createElement('img');
    img.title = file.name ?? '';
    img.alt = '';
    reader.addEventListener('load', (e) => img.src = String(e.target?.result ?? ''), { once: true });
    reader.readAsDataURL(file);
    return img;
};

const imagePrompt = (): Promise<HTMLImageElement | null> => {
    return new Promise(resolve => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.addEventListener('change', () => {
            const files = fileInput.files;
            if (!files?.length) {
                resolve(null);
            }
            else {
                const img = getImageFromFile(files[0]);
                resolve(img)
            }
        });
        fileInput.click();
    });
};

const header = document.createElement('header');

const footer = document.createElement('footer');
footer.replaceChildren(unusedItemsRow, openDialogButton);


main.replaceChildren(...tiers);
container.replaceChildren(header, main, footer);

document.body.replaceChildren(container);

// Can't assign computed style until this is on the dom
const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.addEventListener('input', () => container.style.setProperty('--color', colorPicker.value))
const x = getComputedStyle(container).getPropertyValue('--color');
colorPicker.value = x;
header.append(colorPicker);