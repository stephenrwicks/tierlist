type TierList = {
    name: string;
    tiers: TTier[];
}

type TTier = {
    containerDiv: HTMLDivElement;
    dropDiv: HTMLDivElement;
    nameDiv: HTMLButtonElement;
    items: TItem[];
    sortOrder: number;
}

type TItem = {
    containerButton: HTMLButtonElement;
    img: HTMLImageElement | null;
    src: string;
    name: string;
    add(): void;
    edit(): Promise<TItem | null>;
    delete(): void;
}



const ITEMSET: Set<TItem> = new Set();


const Tier = (name: string = '', items: TItem[] = []) => {
    const containerDiv = document.createElement('div');
    const nameDiv = document.createElement('button');
    nameDiv.type = 'button';
    nameDiv.textContent = name;

    const dropDiv = document.createElement('div');
    dropDiv.className = 'drop';

    const currentItems: Set<TItem> = new Set(items);

    containerDiv.append(nameDiv, dropDiv)

    containerDiv.addEventListener('add-item', (e) => {
        const item: TItem = (e as CustomEvent).detail;
        currentItems.add(item);
    });

    containerDiv.addEventListener('remove-item', (e) => {
        const item: TItem = (e as CustomEvent).detail;
        currentItems.delete(item);
    });


    // Get items based on order on DOM
    // Does a tier track its items, or does an item simply track its tier based on name
    // Probably easier to use the nested structure for loading - Tier has a list of items

    const _TIER: TTier = {
        containerDiv,
        dropDiv,
        nameDiv,
        get items() {
            return [...currentItems]; // This works, just need to rearrange
            // Maybe have a set and we retrieve an array based on sort order
            //return _items;
        },
        sortOrder: 0
    }
    return _TIER;

};




// The img prop should actually be src because that is what we are loading here
const Item = (_NAME: string = '', _IMG: HTMLImageElement | null = null): TItem => {

    const _CONTAINERBUTTON = document.createElement('button');
    _CONTAINERBUTTON.type = 'button';
    _CONTAINERBUTTON.className = 'item';

    const placeholder = document.createElement('div');
    placeholder.className = 'item';

    let offsetX = 0;
    let offsetY = 0;
    const dropPlaceholder = (e: PointerEvent) => {
        const elementsFromPoint = document.elementsFromPoint(e.clientX, e.clientY);
        const parent = elementsFromPoint.find(el => el.classList.contains('drop') && TIERLIST.contains(el)) as HTMLDivElement | undefined;
        if (!parent) {
            unusedItemsRow.append(placeholder);
            return;
        };
        // for (const tier of tiers) {
        //     const drop = tier.querySelector('.drop');
        //     if (!drop) continue;
        //     drop.classList.remove('active');
        //     if (drop === parent) drop.classList.add('active');
        // }
        if (!parent.children.length) return parent.append(placeholder);
        let closest = { el: parent.children[0], distanceX: Number.MAX_SAFE_INTEGER };
        // Children is immediately populated with placeholder, so might have to filter, or find smarter way
        // Need to introduce y coordinates, or else second row doesn't work
        let method: 'before' | 'after' = 'before';
        for (const el of parent.children) {
            const rect = el.getBoundingClientRect();
            const width = rect.right - rect.left;
            const height = rect.top - rect.bottom;
            const distanceX = Math.abs(width / 2 + rect.left - e.clientX);
            const distanceY = Math.abs(height / 2 + rect.top - e.clientY);
            const isClosestSibling = distanceX < closest.distanceX;
            // NEEDS distanceY to get correct row
            if (isClosestSibling) {
                closest = { el, distanceX };
                const distanceToRight = Math.abs(rect.right - e.clientX);
                const distanceToLeft = Math.abs(rect.left - e.clientX);
                method = distanceToRight > distanceToLeft ? 'before' : 'after';
            }
        }
        closest.el[method](placeholder);
    };
    const handleDown = (e: PointerEvent) => {
        e.preventDefault();
        const rect = _CONTAINERBUTTON.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp, { once: true });
    };
    const handleMove = (e: PointerEvent) => {
        _CONTAINERBUTTON.dispatchEvent(new CustomEvent('remove-item', { bubbles: true, detail: _ITEM }));
        _CONTAINERBUTTON.style.position = 'absolute';
        _CONTAINERBUTTON.style.left = `${e.clientX - offsetX + window.scrollX}px`;
        _CONTAINERBUTTON.style.top = `${e.clientY - offsetY + window.scrollY}px`;
        _CONTAINERBUTTON.classList.add('drag');
        dropPlaceholder(e);
    };
    const handleUp = () => {
        placeholder.replaceWith(_CONTAINERBUTTON);
        _CONTAINERBUTTON.dispatchEvent(new CustomEvent('add-item', { bubbles: true, detail: _ITEM }));
        _CONTAINERBUTTON.style.position = '';
        _CONTAINERBUTTON.style.left = '';
        _CONTAINERBUTTON.style.top = '';
        _CONTAINERBUTTON.classList.remove('drag');
        window.removeEventListener('pointermove', handleMove);
    };
    const edit = () => {
        const { promise, resolve } = Promise.withResolvers<TItem | null>();

        const dialog = document.createElement('dialog');
        const form = document.createElement('form');
        const id = `_${crypto.randomUUID()}`;
        let _editedImg: HTMLImageElement | null = _IMG ? _IMG.cloneNode() as HTMLImageElement : null;

        const addImageButton = document.createElement('button');
        addImageButton.type = 'button';
        addImageButton.textContent = 'Select Image';
        addImageButton.className = 'add-image-button';
        addImageButton.addEventListener('click', async () => {
            _editedImg = await imagePrompt();
            if (!_editedImg) {
                submitButton.disabled = true;
                return;
            };
            inputWrapper.after(_editedImg);
            submitButton.disabled = false;
        });

        const clearImageButton = document.createElement('button');
        clearImageButton.type = 'button';
        clearImageButton.textContent = 'Clear';
        clearImageButton.className = 'clear-image-button';
        clearImageButton.addEventListener('click', () => {
            submitButton.disabled = true;
            input.value = '';
            _editedImg?.remove();
            _editedImg = null;
        });

        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = 'Name';

        const input = document.createElement('input');
        input.id = id;
        input.type = 'text';
        input.maxLength = 30;
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
        submitButton.disabled = !_ITEM.name || !_ITEM.img;

        const deleteItemButton = document.createElement('button');
        deleteItemButton.type = 'button';
        deleteItemButton.textContent = 'Delete';
        deleteItemButton.style.marginRight = 'auto';
        deleteItemButton.addEventListener('click', () => {
            _CONTAINERBUTTON.dispatchEvent(new CustomEvent('remove-item', { detail: _ITEM }));
            _ITEM.delete();
            dialog.remove();
        });

        const content = document.createElement('div');
        content.className = 'form-content';
        content.replaceChildren(addImageButton, inputWrapper, clearImageButton);

        const buttonRow = document.createElement('div');
        buttonRow.className = 'button-row';
        buttonRow.replaceChildren(cancelButton, submitButton);
        if (ITEMSET.has(_ITEM)) buttonRow.prepend(deleteItemButton);

        if (_editedImg) {
            inputWrapper.after(_editedImg);
            input.value = _NAME ?? '';
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            dialog.remove();
            const inputValue = input.value.trim();
            if (!_editedImg || !inputValue) {
                resolve(null);
                return;
            }
            _ITEM.img = _editedImg;
            _ITEM.name = inputValue;
            resolve(_ITEM);
        });

        dialog.addEventListener('cancel', () => {
            dialog.remove();
            resolve(null);
        });

        form.replaceChildren(content, buttonRow);
        dialog.replaceChildren(form);

        TIERLIST.append(dialog);
        dialog.showModal();

        return promise;
    };

    _CONTAINERBUTTON.addEventListener('pointerdown', handleDown);
    _CONTAINERBUTTON.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            edit();
        }
    });
    _CONTAINERBUTTON.addEventListener('dblclick', edit);

    const textDiv = document.createElement('div');

    const _ITEM = {
        containerButton: _CONTAINERBUTTON,
        get name() {
            return _NAME;
        },
        set name(name: string) {
            _NAME = name.trim();
            textDiv.textContent = _NAME;
        },
        get img() {
            return _IMG;
        },
        set img(img: HTMLImageElement | null) {
            _IMG = img;
            _CONTAINERBUTTON.replaceChildren(_IMG ? _IMG : '', textDiv);

        },
        get src() {
            return this.img?.src ?? '';
        },
        add() {
            ITEMSET.add(this);
            unusedItemsRow.append(_CONTAINERBUTTON);
        },
        edit,
        delete() {
            _CONTAINERBUTTON.remove();
            ITEMSET.delete(this);
        },
    };

    return _ITEM;
};

const TIERLIST = document.createElement('div');
TIERLIST.className = 'sw-tier-list sw-theme';

const defaultTiers = ['S', 'A', 'B', 'C', 'D', 'F'];
const tiers = new Set(defaultTiers.map(t => Tier(t)));

const main = document.createElement('main');

const unusedItemsRow = document.createElement('div');
unusedItemsRow.className = 'unused-items';

const addItemButton = document.createElement('button');
addItemButton.type = 'button';
addItemButton.className = 'solid';
addItemButton.textContent = 'Add Item';
addItemButton.addEventListener('click', async () => {
    const item = await Item().edit();
    if (!item) return;
    item.add();
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
        fileInput.accept = 'image/*';
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

// const textPrompt = 

const header = document.createElement('header');

const footer = document.createElement('footer');
footer.replaceChildren(unusedItemsRow, addItemButton);


main.replaceChildren(...Array.from(tiers).map(t => t.containerDiv));
TIERLIST.replaceChildren(header, main, footer);

document.body.replaceChildren(TIERLIST);

// Can't assign computed style until this is on the dom
const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.addEventListener('input', () => TIERLIST.style.setProperty('--color', colorPicker.value))
colorPicker.value = getComputedStyle(TIERLIST).getPropertyValue('--color');

const saveButton = document.createElement('button');
saveButton.type = 'button';
saveButton.textContent = '💾';
saveButton.title = 'Save';
saveButton.addEventListener('click', () => {
    console.log('a');
    console.log(JSON.stringify([...ITEMSET]));
});
const openButton = document.createElement('button');
openButton.type = 'button';
openButton.textContent = '📁';
openButton.title = 'Open';
openButton.addEventListener('click', () => {

});

header.append(openButton, saveButton, colorPicker);