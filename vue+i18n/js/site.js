const { createApp, ref, watch, computed } = Vue;
const { createI18n } = VueI18n;
const { useForm, useField } = VeeValidate;

// 模擬 API 調用
const fetchLanguageMessages = async (lang) => {
    try {
        const response = await fetch(`./mock/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const messages = await response.json();
        return messages;
    } catch (error) {
        console.error("Could not fetch localization data:", error);
        return {}; // Return an empty object or handle the error as appropriate
    }

};

const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {}
});

// Datatable 元件
const Datatable = {
    props: ['columns', 'data', 'pageSize'],
    setup(props) {
        const { t } = i18n.global;
        const currentPage = ref(1);

        const translatedColumns = computed(() =>
            props.columns.map(col => ({
                ...col,
                label: t(col.label)
            }))
        );

        const totalPages = computed(() => Math.ceil(props.data.length / props.pageSize));

        const paginatedData = computed(() => {
            const start = (currentPage.value - 1) * props.pageSize;
            const end = start + props.pageSize;
            return props.data.slice(start, end);
        });

        const nextPage = () => {
            if (currentPage.value < totalPages.value) {
                currentPage.value++;
            }
        };

        const previousPage = () => {
            if (currentPage.value > 1) {
                currentPage.value--;
            }
        };

        const pageInfo = computed(() => {
            return t('pageInfo', { current: currentPage.value, total: totalPages.value });
        });

        return {
            translatedColumns,
            paginatedData,
            nextPage,
            previousPage,
            currentPage,
            totalPages,
            pageInfo
        }
    },
    template: `
                <table>
                    <thead>
                        <tr>
                            <th v-for="col in translatedColumns" :key="col.key">{{ col.label }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in paginatedData" :key="row.id">
                            <td v-for="col in columns" :key="col.key">{{ row[col.key] }}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="pagination">
                    <button @click="previousPage" :disabled="currentPage === 1">{{ $t('PreviousPage') }}</button>
                    <span>{{ PageInfo }}</span>
                    <button @click="nextPage" :disabled="currentPage === totalPages">{{ $t('NextPage') }}</button>
                </div>
            `
};

const app = createApp({
    components: {
        Datatable
    },
    setup() {
        const { handleSubmit, errors, validate } = useForm();
        const { value: name } = useField('name', (value) => !!value || i18n.global.t('Form.NameRequired'));
        const { value: email } = useField('email', [
            (value) => !!value || i18n.global.t('Form.EmailRequired'),
            (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || i18n.global.t('Form.EmailInvalid')
        ]);

        const loadedLanguages = ref(['']);

        const loadLanguageAsync = async (lang) => {
            if (loadedLanguages.value.includes(lang)) {
                return;
            }

            const messages = await fetchLanguageMessages(lang);
            i18n.global.setLocaleMessage(lang, messages);
            loadedLanguages.value.push(lang);
        };

        const changeLanguage = async (lang) => {
            await loadLanguageAsync(lang);
            i18n.global.locale.value = lang;
            await validate();
        };

        const submitForm = handleSubmit((values) => {
            alert(JSON.stringify(values, null, 2));
        });

        // Datatable 數據
        const columns = [
            { key: 'id', label: 'Table.Id' },
            { key: 'name', label: 'Table.Name' },
            { key: 'age', label: 'Table.Age' },
            { key: 'country', label: 'Table.Country' }
        ];

        const tableData = [
            { id: 1, name: 'John Doe', age: 30, country: 'USA' },
            { id: 2, name: 'Jane Smith', age: 25, country: 'Canada' },
            { id: 3, name: 'Bob Johnson', age: 35, country: 'UK' },
        ];

        loadLanguageAsync('en');

        return {
            name,
            email,
            errors,
            submitForm,
            changeLanguage,
            columns,
            tableData
        };
    }
});

app.use(i18n);
app.mount('#app');
