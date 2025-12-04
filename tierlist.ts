type TTier = {
    containerDiv: HTMLDivElement;
    dropDiv: HTMLDivElement;
    valueBox: HTMLButtonElement;
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


const Tier = (value: string) => {
    const containerDiv = document.createElement('div');
    const valueBox = document.createElement('button');
    valueBox.type = 'button';
    valueBox.textContent = value;

    const dropDiv = document.createElement('div');
    dropDiv.className = 'drop';

    const currentItems: Set<TItem> = new Set();

    containerDiv.append(valueBox, dropDiv)

    containerDiv.addEventListener('add-item', (e) => {
        console.log(e);
    });

    containerDiv.addEventListener('remove-item', (e) => {
        console.log(e);
    });




    const x: TTier = {
        containerDiv,
        dropDiv,
        valueBox,
        get items() {
            return [];
            //return _items;
        },
        sortOrder: 0
    }
    return x;

};





const Item = (): TItem => {

    let _NAME = '';
    let _IMG: HTMLImageElement | null = null;
    const _CONTAINERBUTTON = document.createElement('button');

    _CONTAINERBUTTON.type = 'button';
    _CONTAINERBUTTON.className = 'item';
    const placeholder = document.createElement('div');
    placeholder.className = 'item';
    let offsetX = 0;
    let offsetY = 0;

    const dropPlaceholder = (e: PointerEvent) => {
        const elementsFromPoint = document.elementsFromPoint(e.clientX, e.clientY);
        const parent = elementsFromPoint.find(el => el.classList.contains('drop')) as HTMLDivElement | undefined;
        if (!parent) return;
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
        const rect = _CONTAINERBUTTON.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp, { once: true });
    };
    const handleMove = (e: PointerEvent) => {
        main.append(_CONTAINERBUTTON);
        _CONTAINERBUTTON.style.position = 'absolute';
        _CONTAINERBUTTON.style.left = `${e.clientX - offsetX}px`;
        _CONTAINERBUTTON.style.top = `${e.clientY - offsetY}px`;
        _CONTAINERBUTTON.classList.add('drag');
        dropPlaceholder(e);
    };
    const handleUp = () => {
        placeholder.replaceWith(_CONTAINERBUTTON);
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

        const content = document.createElement('div');
        content.className = 'form-content';
        content.replaceChildren(addImageButton, inputWrapper, clearImageButton);

        const buttonRow = document.createElement('div');
        buttonRow.className = 'button-row';
        buttonRow.replaceChildren(cancelButton, submitButton);

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
unusedItemsRow.className = 'drop';


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