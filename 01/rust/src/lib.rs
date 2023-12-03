use once_cell::sync::Lazy;
use regex::Regex;

fn line_sum(line: &str) -> usize {
    static NUMBER_MATCHER: Lazy<Regex> = Lazy::new(|| Regex::new(r"([0-9])").unwrap());
    let mut matches = NUMBER_MATCHER.captures_iter(line);
    let first = matches
        .nth(0)
        .expect("Could not find a number in this line")
        .extract::<1>()
        .1[0];
    let last = matches.last();

    match last {
        Some(last_number) => first.to_owned() + last_number.extract::<1>().1[0],
        _ => first.to_owned() + first,
    }
    .parse::<usize>()
    .expect("Could not parse number. This should not happen")
}

pub fn multi_line_sum(input: &str) -> usize {
    input
        .split("\n")
        .filter(|line| !line.trim().eq(""))
        .map(|line| line_sum(line))
        .sum()
}
