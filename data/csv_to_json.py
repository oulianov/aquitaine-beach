import pandas as pd

# Original dataset
# https://www.data.gouv.fr/en/datasets/liste-des-plages-et-activites-de-plage-en-aquitaine-4/
df = pd.read_csv("plages.csv")

# Concatenate complementary info columns
col_info_compl = [
    "MARQUES_LABELS",
    "SERVICES",
    "INFOS_COMPLEMENTAIRES_2",
    "INFOS_COMPLEMENTAIRES_1",
    "INFOS_COMPLEMENTAIRES_3",
    "LABEL_TOURISME_HANDICAP",
    "EQUIPEMENTS",
    "VISITE_CONDITIONS_IND",
]


def clean_info_compl(txt, return_list=False):
    # INFO_COMPLEMENTAIRES is a list of tags separated by #
    tags = txt.split("#")
    tags = [t.strip() for t in tags]
    # We remove duplicate tags
    tags = list(set(tags))
    # Order them by alphabetical order
    tags.sort()
    if return_list:
        txt = tags
    else:
        txt = " # ".join(tags).strip()
    return txt


df["TYPE"] = df["TYPE"].apply(lambda x: clean_info_compl(x, False))


def merge_info_compl(line):
    line = line.fillna("")
    for col in col_info_compl:
        line[col] = line[col].replace("\r\n", "")
        line[col] = clean_info_compl(line[col])
    line = line[col_info_compl].to_list()
    # Filter out empty values
    line = [d for d in line if d != ""]
    txt = "\n".join(line).strip()
    txt = clean_info_compl(txt)
    return txt


df["DESCRIPTION"] = df.apply(
    merge_info_compl,
    axis=1,
)
df.drop(col_info_compl, axis=1, inplace=True)


# Create a global address
col_merge_address = ["BATIMENT_RESIDENCE", "RUE", "LIEUDIT_BP"]


def merge_address(line):
    line = line.fillna("")
    infos = line[col_merge_address].to_list()
    # Sort by length (longer strings firsst)
    infos.sort(key=len, reverse=True)
    # To avoid duplicate location informations, we have the following algo:
    infos_clean = []
    for info in infos:
        info_already_in_infos_clean = False
        for info_clean in infos_clean:
            if info in info_clean:  # This subtext is already somewhere
                info_already_in_infos_clean = True
                break
        if not info_already_in_infos_clean:
            infos_clean.append(info)
    address = ", ".join(infos_clean).strip()
    return address


df["ADRESSE"] = df.apply(merge_address, axis=1)
df.drop(col_merge_address, axis=1, inplace=True)

# Drop non-relevant columns
df.drop(
    [
        "PORTE_ESCALIER",
        "GEOLOC_MANUELLE",
        "VISITE_LANGUES_PARLEES",
        "COMMUNE_INSEE",
    ],
    axis=1,
    inplace=True,
)

# Rename some columns
df.rename({"MEL": "MAIL", "NOM_OFFRE": "NOM"}, axis=1, inplace=True)


# Last but not least... replace column names by lowercase ones.
df.columns = [c.lower() for c in df.columns]
print(df.columns)

# Export to njson
df.to_json("plages.json", orient="records", lines=True)
